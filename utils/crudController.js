import { supabase } from '../config/supabase.js';

export const createCrudController = (tableName) => {
  return {
    index: async (req, res) => {
      try {
        const { data, error } = await supabase.from(tableName).select('*');

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch records' });
      }
    },

    store: async (req, res) => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .insert([req.body])
          .select()
          .single();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        res.status(201).json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create record' });
      }
    },

    show: async (req, res) => {
      try {
        const { id } = req.params;
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!data) {
          return res.status(404).json({ message: `${tableName} not found` });
        }

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        res.json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch record' });
      }
    },

    update: async (req, res) => {
      try {
        const { id } = req.params;

        const { data: existing } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!existing) {
          return res.status(404).json({ message: `${tableName} not found` });
        }

        const { data, error } = await supabase
          .from(tableName)
          .update(req.body)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        res.json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update record' });
      }
    },

    destroy: async (req, res) => {
      try {
        const { id } = req.params;

        const { data: existing } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!existing) {
          return res.status(404).json({ message: `${tableName} not found` });
        }

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        res.json({ message: `${tableName} deleted successfully` });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete record' });
      }
    }
  };
};
