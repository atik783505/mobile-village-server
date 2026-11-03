import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

const generateUniqueSKU = (category: string) => {
  const prefix = category ? category.slice(0, 3).toUpperCase() : 'PRD';
  const timestamp = Date.now().toString().slice(-4);
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timestamp}${randomNum}`;
};
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      shortDescription,
      fullDescription,
      category,
      price,
      stock,
      images,
      brand,
      userSKU,
      discountPrice,
      specifications,
    } = req.body;
    if (!name || !shortDescription || !fullDescription || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, short description, full description, category, and price are required fields.',
      });
    }
    const finalSKU = userSKU ? userSKU.toUpperCase() : generateUniqueSKU(category);

    const newProduct = await prisma.product.create({
      data: {
        name,
        shortDescription,
        fullDescription,
        category,
        price: parseFloat(price),
        stock: stock ? parseInt(stock, 10) : 0,
        images: images ? (Array.isArray(images) ? images : [images]) : [],
        brand: brand || null,
        sku: finalSKU,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        specifications: specifications || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      data: newProduct,
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'A product with this SKU already exists. Please use a unique SKU.',
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while creating the product',
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      shortDescription,
      fullDescription,
      category,
      price,
      stock,
      images,
      brand,
      sku,
      discountPrice,
      isAvailable,
      specifications,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id: id as string },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with this ID.',
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id as string },
      data: {
        ...(name && { name }),
        ...(shortDescription && { shortDescription }),
        ...(fullDescription && { fullDescription }),
        ...(category && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(images && { images: Array.isArray(images) ? images : [images] }),
        ...(brand !== undefined && { brand: brand || null }),
        ...(sku && { sku: sku.toUpperCase() }),
        ...(discountPrice !== undefined && { discountPrice: discountPrice ? parseFloat(discountPrice) : null }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(specifications !== undefined && { specifications }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      data: updatedProduct,
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'A product with this SKU already exists. Please use a unique SKU.',
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while updating the product',
    });
  }
};
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while fetching products',
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: id as string },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found with this ID.',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while fetching the product.',
    });
  }
};