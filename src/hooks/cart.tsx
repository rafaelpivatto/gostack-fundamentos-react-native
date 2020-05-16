import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (storageProducts) {
        setProducts(JSON.parse(storageProducts));
      }
    }
    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      if (!id) return;

      setProducts([
        ...products.map(prod => {
          if (prod.id === id) {
            return {
              ...prod,
              quantity: prod.quantity + 1,
            };
          }
          return prod;
        }),
      ]);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      if (!id) return;

      const productsWithDecremented = products
        .map(prod => {
          if (prod.id === id) {
            return {
              ...prod,
              quantity: prod.quantity - 1,
            };
          }
          return prod;
        })
        .filter(prod => prod.quantity > 0);

      setProducts([...productsWithDecremented]);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productFound = products.find(prod => prod.id === product.id);
      if (productFound) {
        increment(product.id);
      } else {
        const newProduct: Product = {
          id: product.id,
          title: product.title,
          price: product.price,
          image_url: product.image_url,
          quantity: 1,
        };

        setProducts([newProduct, ...products]);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
