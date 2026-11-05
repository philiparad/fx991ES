"""Offline tests for the browser-evidence release gate; no browsers required."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('browser_matrix', Path(__file__).resolve().parents[1]/'browser_matrix.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class EvidenceGateTests(unittest.TestCase):
    def sample(self, browser='chromium', status='PASS'):
        agents = {'chromium':'Mozilla/5.0 Chrome/120.0', 'firefox':'Mozilla/5.0 Firefox/120.0',
                  'webkit':'Mozilla/5.0 AppleWebKit/605.1 Safari/605.1'}
        return {'schema':m.SCHEMA, 'milestone':34, 'userAgent':agents[browser],
                'results':[{'name':f'check-{i:02d}','status':status} for i in range(18)]}

    def test_valid_capture(self):
        names,count=m.check_capture(self.sample(),'chromium')
        self.assertEqual(len(names),18)
        self.assertEqual(count,18)

    def test_reject_duplicate_checks(self):
        data=self.sample()
        data['results'][1]['name']=data['results'][0]['name']
        with self.assertRaisesRegex(ValueError,'Duplicate'):
            m.check_capture(data,'chromium')

    def test_reject_short_report(self):
        data=self.sample();data['results'].pop()
        with self.assertRaisesRegex(ValueError,'Expected 18'):
            m.check_capture(data,'chromium')

    def test_reject_spoofed_browser_label(self):
        with self.assertRaisesRegex(ValueError,'Firefox'):
            m.check_capture(self.sample('chromium'),'firefox')

    def test_reject_invalid_status(self):
        data=self.sample();data['results'][0]['status']='SKIPPED'
        with self.assertRaisesRegex(ValueError,'Invalid check status'):
            m.check_capture(data,'chromium')

    def test_fail_closed_when_missing_browser(self):
        self.assertFalse(m.aggregate([{'browser':'chromium','status':'PASS','names':['a']}]))

    def test_pass_matching_three_browser_matrix(self):
        rows=[dict(browser=b,status='PASS',names=['a','b']) for b in m.BROWSERS]
        self.assertTrue(m.aggregate(rows))

    def test_fail_mismatched_check_names(self):
        rows=[dict(browser=b,status='PASS',names=['a','b']) for b in m.BROWSERS]
        rows[1]['names']=['a','c']
        self.assertFalse(m.aggregate(rows))

    def test_fail_blocked_browser(self):
        rows=[dict(browser=b,status='PASS',names=['a','b']) for b in m.BROWSERS]
        rows[2]['status']='BLOCKED'
        self.assertFalse(m.aggregate(rows))


if __name__ == '__main__':
    unittest.main()