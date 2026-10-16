-- Permit negative inventory balances after an explicitly confirmed POS sale.
-- The POS warns the operator before applying quantities greater than available stock.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_check;
