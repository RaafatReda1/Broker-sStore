-- Recreate the function with SECURITY DEFINER
DROP FUNCTION IF EXISTS update_broker_balance() CASCADE;

CREATE OR REPLACE FUNCTION update_broker_balance()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    broker_to_update bigint;
BEGIN
    IF TG_OP = 'DELETE' THEN
        broker_to_update := OLD."brokerId";
    ELSIF TG_OP = 'INSERT' THEN
        broker_to_update := NEW."brokerId";
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD."brokerId" IS NOT NULL AND OLD."brokerId" != NEW."brokerId" THEN
            UPDATE public."Brokers"
            SET 
                "actualBalance" = (
                    SELECT COALESCE(SUM("netProfit"), 0)
                    FROM public."Orders"
                    WHERE "brokerId" = OLD."brokerId" AND status = true
                ),
                "suspendedBalance" = (
                    SELECT COALESCE(SUM("netProfit"), 0)
                    FROM public."Orders"
                    WHERE "brokerId" = OLD."brokerId" AND status = false
                )
            WHERE id = OLD."brokerId";
        END IF;
        broker_to_update := NEW."brokerId";
    END IF;
    
    IF broker_to_update IS NOT NULL THEN
        UPDATE public."Brokers"
        SET 
            "actualBalance" = (
                SELECT COALESCE(SUM("netProfit"), 0)
                FROM public."Orders"
                WHERE "brokerId" = broker_to_update AND status = true
            ),
            "suspendedBalance" = (
                SELECT COALESCE(SUM("netProfit"), 0)
                FROM public."Orders"
                WHERE "brokerId" = broker_to_update AND status = false
            )
        WHERE id = broker_to_update;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_broker_balance ON public."Orders";

CREATE TRIGGER trigger_update_broker_balance
    AFTER INSERT OR UPDATE OR DELETE
    ON public."Orders"
    FOR EACH ROW
    EXECUTE FUNCTION update_broker_balance();