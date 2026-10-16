import pandas as pd
import numpy as np

train_df = pd.read_csv("data/raw/train.csv")
test_df = pd.read_csv("data/raw/test.csv")

print("=== TRAIN DATASET SHAPE ===")
print(train_df.shape)
print("\n=== TRAIN COLUMNS & TYPES ===")
print(train_df.dtypes)
print("\n=== TRAIN HEAD (5 rows) ===")
print(train_df.head(5).to_string())

print("\n=== TRAIN MISSING VALUES ===")
print(train_df.isnull().sum())

print("\n=== TRAIN DUPLICATES ===")
print("Duplicate rows count:", train_df.duplicated().sum())

print("\n=== TRAIN SUMMARY STATS ===")
print(train_df.describe(include='all').to_string())

print("\n=== TEST DATASET SHAPE ===")
print(test_df.shape)
print("\n=== TEST COLUMNS ===")
print(test_df.columns.tolist())
print("\n=== TEST HEAD (3 rows) ===")
print(test_df.head(3).to_string())
