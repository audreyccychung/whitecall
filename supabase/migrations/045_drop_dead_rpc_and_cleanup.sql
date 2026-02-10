-- V2 Audit Cleanup: Drop dead RPC function
-- get_friends_on_call_today() is superseded by get_friends_with_status()
-- It also lacks the shift_type filter added in migration 043, making it buggy if ever called.

DROP FUNCTION IF EXISTS get_friends_on_call_today();
