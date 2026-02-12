SELECT
  i.inc_id,
  i.amount,
  i.notes,
  i.year,
  i.month,
  i.day,
  ct_type.name AS TYPE,
  m."name_kFull" AS name,
  i.qt,
  i.created_at,
  ct_method.name AS method
FROM
  (
    (
      (
        "Income" i
        LEFT JOIN "Category" ct_type ON ((i.inc_type = ct_type.ctg_id))
      )
      LEFT JOIN "Category" ct_method ON ((i.inc_method = ct_method.ctg_id))
    )
    LEFT JOIN "Member" m ON ((m.mbr_id = i.member))
  );