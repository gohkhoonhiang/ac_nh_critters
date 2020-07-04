require 'rubygems'
require 'json'
require 'csv'
require 'nokogiri'

# References:
# HTML to CSV: https://gist.github.com/sandys/3910840
#
def convert_html_to_csv(input, output)
  f = File.open(input)
  doc = Nokogiri::HTML(f)
  csv = CSV.open(output, 'w', col_sep: ",", quote_char: '"', force_quotes: true)

  # headers
  csv << ['Name', 'Image', 'Price', 'Shadow size', 'Swimming pattern', 'Time', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  doc.xpath('//table/tbody/tr').each do |row|
    tarray = []
    row.xpath('td').each_with_index do |cell, index|
      if index.between?(6, 17)
        tarray << cell.text.strip.gsub(/-/, 'FALSE')
      else
        tarray << cell.text.strip
      end
    end
    csv << tarray
  end

  csv.close
end
