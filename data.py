import re
import csv

input_file_path = 'input.txt'
output_file_path = 'output.csv'

sender_receiver_pairs = []

# Read the input text file line by line
with open(input_file_path, 'r') as file:
    lines = file.readlines()

# Extract sender and receiver names using regular expressions
pattern = r'\[.*\]\s*~\s*([^:]+):\s*([^t]+)to\s+([^0-9]+)'
for line in lines:
    match = re.search(pattern, line)
    if match:
        sender = match.group(2).strip()
        receiver = match.group(3).strip()
        sender_receiver_pairs.append((sender, receiver))

# Write the extracted sender and receiver names to a CSV file
with open(output_file_path, 'w', newline='') as csvfile:
    csvwriter = csv.writer(csvfile)
    csvwriter.writerow(['Sender', 'Receiver'])
    for sender, receiver in sender_receiver_pairs:
        csvwriter.writerow([sender, receiver])

print('CSV file saved successfully.')
