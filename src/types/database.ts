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
  categoryId?: number | null;
  basePrice: number;
  thumbnailUrl?: string | null;
  isActive: boolean;
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
}

export interface ProductSKU {
  id: number;
  productId: number;
  skuCode: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
}

export interface SKUAttributeValue {
  productSkuId: number;
  attributeValueId: number;
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
  quantity: number;
  unitPrice: number;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment?: string | null;
  createdAt?: Date | null;
}

