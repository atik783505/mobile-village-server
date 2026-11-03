import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ১. ইউজারের কার্ট ফেচ করা
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string; 

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login to view cart.',
      });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true, 
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while fetching the cart.',
    });
  }
};

// ২. কার্টে প্রোডাক্ট যোগ করা
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login to add items to cart.',
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    if (existingCartItem) {
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + parseInt(quantity, 10) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: parseInt(quantity, 10),
        },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product added to cart successfully!',
      data: updatedCart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while adding to cart.',
    });
  }
};

// ৩. কার্ট থেকে নির্দিষ্ট আইটেম রিমুভ করা
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    const { itemId } = req.params as { itemId: string };

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Cart item ID is required.',
      });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found or unauthorized.',
      });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully!',
      data: updatedCart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while removing item.',
    });
  }
};

// ৪. গেস্ট ইউজার যখন লগইন করবে, তখন লোকালস্টোরেজ কার্ট ডাটাবেজের সাথে সিঙ্ক (Merge) করা
export const syncCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    const { items } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized.',
      });
    }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cart items format.',
      });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity) continue;

      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + parseInt(quantity, 10) },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: parseInt(quantity, 10),
          },
        });
      }
    }

    const finalCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Cart synced successfully!',
      data: finalCart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while syncing cart.',
    });
  }
};