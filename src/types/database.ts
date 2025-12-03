export interface Role {
  id: number;
  roleName: string;
  description?: string | null;
}

export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roleId: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UserAddress {
  id: number;
  userId: number;
  recipientName?: string | null;
  phoneNumber?: string | null;
  addressLine?: string | null;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  isDefault: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug?: string | null;
  parentId?: number | null;
  imageUrl?: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  basePrice: number;
  thumbnailUrl?: string | null;
  isActive: boolean;
  totalSold?: number;
  createdAt?: Date | null;
}

export interface Attribute {
  id: number;
  name: string;
}

export interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  code?: string | null;
}

export interface ProductSKU {
  id: number;
  productId: number;
  skuCode: string;
  colorValueId: number;
  sizeValueId: number;
  price: number;
  stockQuantity: number;
}

export interface ProductGallery {
  id: number;
  productId: number;
  imageUrl: string;
  displayOrder?: number;
}

export interface ProductColorImage {
  id: number;
  productId: number;
  colorValueId: number;
  imageUrl: string;
}

export interface ProductCategory {
  productId: number;
  categoryId: number;
}

export interface Order {
  id: number;
  userId?: number | null;
  orderDate?: Date | null;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  note?: string | null;
}

export interface OrderDetail {
  id: number;
  orderId: number;
  productSkuId?: number | null;
  productName?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice?: number | null;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  orderId: number;
  rating: number;
  comment?: string | null;
  createdAt?: Date | null;
}

export interface ReviewImage {
  id: number;
  reviewId: number;
  imageUrl: string;
}

