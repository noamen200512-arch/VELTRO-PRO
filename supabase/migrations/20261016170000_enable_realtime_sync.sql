-- Enable organization-scoped Supabase Realtime events for VELTRO-PRO business data.
-- Row-level security remains responsible for filtering records for each authenticated user.
DO $$
DECLARE
  table_name text;
  target_tables text[] := ARRAY[
    'organizations', 'branches', 'profiles', 'roles', 'products', 'customers', 'suppliers',
    'sales_invoices', 'sales_invoice_items', 'purchase_invoices', 'purchase_invoice_items',
    'stock_movements', 'customer_payments', 'supplier_payments', 'cash_register_sessions',
    'cash_register_transactions', 'pos_invoice_drafts'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE EXCEPTION 'Supabase publication supabase_realtime does not exist';
  END IF;
  FOREACH table_name IN ARRAY target_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'Required VELTRO-PRO sync table public.% does not exist', table_name;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
