import { supabase } from '../../../lib/supabase';

export const getStops = async () => {
    let allStops: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('Stops')
            .select('*')
            .range(from, from + step - 1);

        if (error) {
            console.error("Supabase error:", error);
            break;
        }

        if (data && data.length > 0) {
            allStops = [...allStops, ...data];
            from += step;
        }

        // If we got fewer than 1000, we've reached the end
        if (!data || data.length < step) {
            hasMore = false;
        }
    }

    return allStops;
};

