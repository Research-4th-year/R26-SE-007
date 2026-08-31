import pandas as pd
import subprocess
import sys
import xml.etree.ElementTree as ET
import os

def main():
    print("Running PyTest and generating XML report...")
    # This runs the pytest suite and generates an XML report without needing plugins
    subprocess.run([sys.executable, "-m", "pytest", "new-tests/", "--junitxml=.report.xml"])
    
    if not os.path.exists(".report.xml"):
        print("Error: Could not find pytest XML output.")
        return

    print("Parsing XML report to Excel...")
    tree = ET.parse(".report.xml")
    root = tree.getroot()
    
    tests = []
    for testcase in root.iter("testcase"):
        name = testcase.get("name")
        classname = testcase.get("classname")
        time_taken = round(float(testcase.get("time", 0)), 3)
        
        status = "PASSED"
        msg = ""
        
        failure = testcase.find("failure")
        error = testcase.find("error")
        
        if failure is not None:
            status = "FAILED"
            msg = failure.get("message", "")
        elif error is not None:
            status = "ERROR"
            msg = error.get("message", "")
            
        tests.append({
            "Test Node ID": f"{classname}::{name}",
            "Status": status,
            "Duration (s)": time_taken,
            "Error Message": msg
        })
        
    df = pd.DataFrame(tests)
    csv_path = "Backend_Test_Results.csv"
    df.to_csv(csv_path, index=False)
    
    print(f"Successfully generated CSV report (opens in Excel): {csv_path}")

if __name__ == "__main__":
    main()
