import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ১. Logged-in user এর order — DB cart থেকে নেয়
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    const { shippingAddress, phone, paymentMethod = 'COD' } = req.body;

    console.log('[createOrder] userId:', userId);
    console.log('[createOrder] body:', { shippingAddress, phone, paymentMethod });

    if (!shippingAddress || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and phone number are required.',
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    console.log('[createOrder] cart found:', cart ? `id=${cart.id}, items=${cart.items.length}` : 'null');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty.',
      });
    }

    // Stock check
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `"${item.product.name}" has only ${item.product.stock} units left.`,
        });
      }
    }

    const totalPrice = cart.items.reduce((sum, item) => {
      return sum + (item.product.discountPrice ?? item.product.price) * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          customerName: dbUser?.name ?? 'Customer',
          totalPrice,
          shippingAddress,
          phone,
          paymentMethod,
          orderStatus: 'PENDING',
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.discountPrice ?? item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while placing the order.',
    });
  }
};

// ২. Guest order — items body থেকে আসে, auth লাগে না
export const createGuestOrder = async (req: Request, res: Response) => {
  try {
    const {
      shippingAddress,
      phone,
      customerName = 'Guest Customer',
      paymentMethod = 'COD',
      items,
    } = req.body;

    if (!shippingAddress || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and phone number are required.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required.',
      });
    }

    // Fetch product details for each item
    const productIds: string[] = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate each item
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `"${product.name}" has only ${product.stock} units left.`,
        });
      }
    }

    const totalPrice = items.reduce((sum: number, item: any) => {
      const product = productMap.get(item.productId)!;
      return sum + (product.discountPrice ?? product.price) * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: null,
          customerName,
          totalPrice,
          shippingAddress,
          phone,
          paymentMethod,
          orderStatus: 'PENDING',
          items: {
            create: items.map((item: any) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.discountPrice ?? product.price,
              };
            }),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while placing the order.',
    });
  }
};

// ৩. User নিজের orders দেখবে
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. Admin সব orders দেখবে
export const getAllOrdersForAdmin = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. Admin order status update করবে
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = req.params['orderId'] as string;
    const { orderStatus } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (!orderStatus || !validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
      });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
