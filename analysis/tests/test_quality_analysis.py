import unittest

import numpy as np

from quality_analysis import lpips_input_array, parse_capture_name, ssim_arrays


class QualityAnalysisTest(unittest.TestCase):
    def test_identical_images_have_unit_ssim(self):
        image = np.full((32, 32, 3), 127, dtype=np.uint8)
        self.assertAlmostEqual(ssim_arrays(image, image), 1.0, places=6)

    def test_visually_different_images_have_low_ssim(self):
        black = np.zeros((32, 32, 3), dtype=np.uint8)
        white = np.full((32, 32, 3), 255, dtype=np.uint8)
        self.assertLess(ssim_arrays(black, white), 0.01)

    def test_capture_filename_is_parsed_into_protocol_fields(self):
        self.assertEqual(
            parse_capture_name("publicStress__sse-16__view-3.png"),
            {"dataset": "publicStress", "sse": 16, "view": 3},
        )

    def test_lpips_input_is_chw_float_in_minus_one_to_one(self):
        image = np.array([[[0, 127, 255]]], dtype=np.uint8)
        tensor = lpips_input_array(image)
        self.assertEqual(tensor.shape, (3, 1, 1))
        self.assertEqual(tensor.dtype, np.float32)
        self.assertAlmostEqual(float(tensor[0, 0, 0]), -1.0)
        self.assertAlmostEqual(float(tensor[2, 0, 0]), 1.0)


if __name__ == "__main__":
    unittest.main()
