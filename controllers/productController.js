import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import { fileSizeFormatter } from "../utils/fileUpload.js";
import { v2 as cloudinary } from "cloudinary";

// @desc Create new product
// @route POST /api/products
// @access Private
export const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  // Validation
  if (!name || !sku || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Fields are required");
  }

  // Handle image upload
  let fileData = {};

  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;

    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        use_filename: true,
        folder: "Pinvent",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error(error);
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

// @desc Get all products
// @route GET /api/products
// @access Private
export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ user: req.user.id }).sort("-createdAt");
  console.log("Controller: ", products);
  res.status(200).json(products);
});

// @desc Get single product
// @route GET /api/products
// @access Private
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  // If product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  res.status(200).json(product);
});

// @desc Update product
// @route PATCH /api/products
// @access Private
export const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // If product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Handle image upload
  let fileData = {};

  if (req.file) {
    // Save image to cloudinary
    let uploadedFile;

    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        use_filename: true,
        folder: "Pinvent",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error(error);
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});

// @desc Delete product
// @route DELETE /api/products
// @access Private
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  // If product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  await Product.deleteOne(product);

  res.json({ message: "Product deleted successfully" });
});
