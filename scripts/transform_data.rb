require 'json'
require 'csv'

InvalidFileFormat = Class.new(StandardError)

def combined_list(northern_list, southern_list, output)
  formatted_northern = format_data(northern_list, northern: true)
  formatted_southern = format_data(southern_list, northern: false)

  combined = formatted_northern + formatted_southern

  File.write(output, { data: combined.sort_by { |row| row["name"] } }.to_json)
end

# example
# Raw data: 
# Name,Image,Price,Location,Shadow size,Time,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec
# Anchovy,,200,Sea,2,4 AM - 9 PM,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE
#
# will be converted to:
# Formatted data: {"name"=>"Anchovy", "image"=>nil, "price"=>200, "location"=>"Sea", "shadow_size"=>2, "time"=>"4 am - 9 pm", "jan"=>true, "feb"=>true, "mar"=>true, "apr"=>true, "may"=>true, "jun"=>true, "jul"=>true, "aug"=>true, "sep"=>true, "oct"=>true, "nov"=>true, "dec"=>true}
def format_data(file_path, northern: true)
  raise InvalidFileFormat unless File.extname(file_path) == ".csv"

  content = CSV.read(file_path, col_sep: ",", headers: true)
  transformed = content.map do |row|
    row.to_h.transform_keys { |k| snake_case(k) }.transform_values { |v| normalize(v) }
  end

  format_rows(transformed, northern)
end

# example
# Raw data: {"name"=>"Anchovy", "image"=>nil, "price"=>"200", "location"=>"Sea", "shadow_size"=>"2", "time"=>"4 AM - 9 PM", "jan"=>true, "feb"=>true, "mar"=>true, "apr"=>true, "may"=>true, "jun"=>true, "jul"=>true, "aug"=>true, "sep"=>true, "oct"=>true, "nov"=>true, "dec"=>true}
#
# will be converted to:
# Formatted data: {"name"=>"Anchovy", "image"=>nil, "price"=>200, "location"=>"Sea", "shadow_size"=>2, "time"=>"4 AM - 9 PM", "jan"=>true, "feb"=>true, "mar"=>true, "apr"=>true, "may"=>true, "jun"=>true, "jul"=>true, "aug"=>true, "sep"=>true, "oct"=>true, "nov"=>true, "dec"=>true, "months"=>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "all_day"=>false, "hours"=>[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], "hemisphere"=>"northern"}
def format_rows(rows, northern)
  rows.each do |row|
    format_row(row, northern)
  end
  rows
end

def format_row(row, northern)
  row["months"] = extract_months(row)
  row["price"] = row["price"].to_i
  row["shadow_size"] = row["shadow_size"].to_i if row["shadow_size"]
  
  all_day, hours = determine_time_range(row)
  row["all_day"] = all_day
  row["hours"] = hours
  row["hemisphere"] = northern ? "northern" : "southern"
end

def extract_months(row)
  months = []

  months << 1  if row["jan"]
  months << 2  if row["feb"]
  months << 3  if row["mar"]
  months << 4  if row["apr"]
  months << 5  if row["may"]
  months << 6  if row["jun"]
  months << 7  if row["jul"]
  months << 8  if row["aug"]
  months << 9  if row["sep"]
  months << 10 if row["oct"]
  months << 11 if row["nov"]
  months << 12 if row["dec"]

  months
end

def determine_time_range(row)
  all_day = false
  hours = []

  if row["time"] == "All day"
    all_day = true
    hours = (0..23).to_a
  elsif /.*\&.*/.match?(row["time"])
    ranges = row["time"].split("&").map { |s| s.strip } # => ["9 AM - 4 PM", "9 PM - 4 AM"]
             .map { |range| range.split("-").map { |t| t.strip } } # => [["9 AM", "4 PM"], ["9 PM", "4 AM"]]
    hours = ranges.inject([]) do |acc, range|
      s, e = range
      acc += extract_hours(s, e)
    end
  else
    s, e = row["time"].split("-").map { |t| t.strip }
    hours = extract_hours(s, e)
  end

  [all_day, hours]
end

def extract_hours(s, e)
  is_overnight = false

  start_hour = if s.match?("am")
    s.tr("am","").to_i
  elsif s.match?("AM")
    s.tr("AM","").to_i
  elsif s.match("pm")
    is_overnight = true
    s.tr("pm","").to_i + 12
  else
    is_overnight = true
    s.tr("PM","").to_i + 12
  end
  start_time = Time.new(2020,1,1,start_hour,0,0,"+00:00")

  end_hour = if e.match?("am")
    e.tr("am","").to_i
  elsif e.match?("AM")
    e.tr("AM","").to_i
  elsif e.match?("pm")
    e.tr("pm","").to_i + 12
  else
    e.tr("PM","").to_i + 12
  end
  end_day = is_overnight ? 2 : 1
  end_time = Time.new(2020,1,end_day,end_hour,0,0,"+00:00")

  hours = [start_time.hour]
  interval = 3600
  stepped_start_time = start_time
  while (stepped_start_time = stepped_start_time + interval) < end_time
    hours << stepped_start_time.hour
  end
  hours << end_time.hour

  hours
end

def snake_case(s)
  s.downcase.tr(' ','_')
end

def normalize(s)
  return if s.nil?

  if s.match?(/TRUE/)
    true
  elsif s.match?(/FALSE/)
    false
  elsif integer?(s)
    s.to_i
  elsif time_range?(s)
    normalize_time(s)
  else
    s
  end
end

def integer?(s)
  Integer(s)
  true
rescue ArgumentError
  false
end

def time_range?(s)
  s.match?(/.*AM.*/i) || s.match?(/.*PM.*/i) || s.match?(/All day/)
end

def normalize_time(s)
  s.gsub("AM","am").gsub("PM","pm")
end
