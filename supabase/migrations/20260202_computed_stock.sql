-- Computed Column for Dynamic Stock
-- This allows querying product.calculated_stock via PostgREST

CREATE OR REPLACE FUNCTION calculated_stock(product_row products)
RETURNS INTEGER AS $$
BEGIN
  IF product_row.is_combo THEN
    -- get_combo_stock must be available from previous migration
    RETURN get_combo_stock(product_row.id);
  ELSE
    RETURN product_row.stock_quantity;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
