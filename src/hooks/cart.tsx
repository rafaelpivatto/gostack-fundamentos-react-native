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
  console.log('========= products', products);

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
      const productIncremented = products.find(prod => prod.id === id);
      const otherProducts = products.filter(prod => prod.id !== id);
      if (productIncremented) {
        productIncremented.quantity += 1;

        setProducts([...otherProducts, productIncremented]);
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      if (!id) return;
      const productIncremented = products.find(prod => prod.id === id);
      const otherProducts = products.filter(prod => prod.id !== id);
      if (productIncremented) {
        productIncremented.quantity -= 1;
        if (productIncremented.quantity > 0) {
          setProducts([...otherProducts, productIncremented]);
        } else {
          setProducts([...otherProducts]);
        }
        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );
      }
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
