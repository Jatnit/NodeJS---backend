-- Migration: Add more colors to AttributeValues
-- Run this SQL to add new colors: Vàng, Nâu, Tím, Hồng, Xanh Lá

INSERT INTO
    AttributeValues (AttributeId, Value, Code)
VALUES (1, 'Vàng', '#FFD700'),
    (1, 'Nâu', '#8B4513'),
    (1, 'Tím', '#800080'),
    (1, 'Hồng', '#FFC0CB'),
    (1, 'Xanh Lá', '#228B22');

-- Note: AttributeId = 1 is for "Màu sắc" (Colors)