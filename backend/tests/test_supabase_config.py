import os
import unittest


class SupabaseConfigTests(unittest.TestCase):
    def test_supabase_client_requires_url_and_key(self):
        os.environ.pop("SUPABASE_URL", None)
        os.environ.pop("SUPABASE_ANON_KEY", None)

        from app.supabase import SupabaseClient

        self.assertFalse(SupabaseClient.is_configured())


if __name__ == "__main__":
    unittest.main()
