INSERT INTO "catalogs" ("id", "payload") VALUES
  ('pitch-surfaces', '{"id":"pitch-surfaces","values":["Synthétique dernière génération","Gazon naturel","Indoor Five","Futsal parquet"]}'::jsonb),
  ('pitch-formats', '{"id":"pitch-formats","values":["11v11","9v9","7v7","5v5","4v4"]}'::jsonb),
  ('pitch-amenities', '{"id":"pitch-amenities","values":["Vestiaires avec douches chaudes","Éclairage nocturne LED","Parking gratuit surveillé","Buvette & Club House","Tribunes abritées","Caméras vidéo HD Replay","Chronomètre & Tableau d’affichage","Ballons & Chasubles fournis","Vestiaires chauffés","Parking gratuit","Tribunes 500 places","Buvette"]}'::jsonb),
  ('tournament-formats', '{"id":"tournament-formats","values":["11v11","9v9","7v7","5v5 (Five)","Futsal"]}'::jsonb),
  ('tournament-team-counts', '{"id":"tournament-team-counts","values":["8","12","16","24","32"]}'::jsonb),
  ('marketplace-categories', '{"id":"marketplace-categories","values":["Crampons","Maillots","Ballons","Gardiens","Équipements"]}'::jsonb),
  ('marketplace-conditions', '{"id":"marketplace-conditions","values":["Neuf avec étiquette","Comme neuf","Très bon état","Bon état"]}'::jsonb),
  ('marketplace-brands', '{"id":"marketplace-brands","values":["Nike","Adidas","Puma","Kipsta","Umbro","Mizuno","Garman Official"]}'::jsonb)
ON CONFLICT ("id") DO UPDATE SET "payload" = EXCLUDED."payload";