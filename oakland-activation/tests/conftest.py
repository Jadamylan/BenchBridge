import os

os.environ["DEMO_MODE"] = "true"
os.environ["WORKFORCE_SOURCE_MODE"] = "DEMO"

from scripts.build_data import main

main()
