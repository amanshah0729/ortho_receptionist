import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'publishable-or-anon-key')

url and key saved as this in in env file:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

Fetch data
select(columns?, options?)
Perform a SELECT query on the table or view.

By default, Supabase projects return a maximum of 1,000 rows. This setting can be changed in your project's API settings. It's recommended that you keep it low to limit the payload size of accidental or malicious requests. You can use range() queries to paginate through your data.
select() can be combined with Filters
select() can be combined with Modifiers
apikey is a reserved keyword if you're using the Supabase Platform and should be avoided as a column name.
Parameters
columns
Optional
Query
The columns to retrieve, separated by commas. Columns can be renamed when returned with customName:columnName

options
Optional
object
Named parameters

Details
Getting your data
Selecting specific columns
Query referenced tables
Query referenced tables with spaces in their names
Query referenced tables through a join table
Query the same referenced table multiple times
Query nested foreign tables through a join table
Filtering through referenced tables
Querying referenced table with count
Querying with count option
Querying JSON data
Querying referenced table with inner join
Switching schemas per query
const { data, error } = await supabase
  .from('characters')
  .select()
Data source
Response
Insert data
insert(values, options?)
Parameters
values
One of the following options
Details
Option 1
Row
Option 2
Array<Row>
options
Optional
object
Details
Create a record
Create a record and return it
Bulk create
const { error } = await supabase
  .from('countries')
  .insert({ id: 1, name: 'Mordor' })
Data source
Response
Update data
update(values, options)
Perform an UPDATE on the table or view.

By default, updated rows are not returned. To return it, chain the call with .select() after filters.

update() should always be combined with Filters to target the item(s) you wish to update.
Parameters
values
Row
The values to update with

options
object
Named parameters

Details
Updating your data
Update a record and return it
Updating JSON data
const { error } = await supabase
  .from('instruments')
  .update({ name: 'piano' })
  .eq('id', 1)
Data source
Response
Upsert data
upsert(values, options?)
Primary keys must be included in values to use upsert.
Parameters
values
One of the following options
Details
Option 1
Row
Option 2
Array<Row>
options
Optional
object
Details
Upsert your data
Bulk Upsert your data
Upserting into tables with constraints
const { data, error } = await supabase
  .from('instruments')
  .upsert({ id: 1, name: 'piano' })
  .select()
Data source
Response
Delete data
delete(options)
Perform a DELETE on the table or view.

By default, deleted rows are not returned. To return it, chain the call with .select() after filters.

delete() should always be combined with filters to target the item(s) you wish to delete.
If you use delete() with filters and you have RLS enabled, only rows visible through SELECT policies are deleted. Note that by default no rows are visible, so you need at least one SELECT/ALL policy that makes the rows visible.
When using delete().in(), specify an array of values to target multiple rows with a single query. This is particularly useful for batch deleting entries that share common criteria, such as deleting users by their IDs. Ensure that the array you provide accurately represents all records you intend to delete to avoid unintended data removal.
Parameters
options
object
Named parameters

Details
Delete a single record
Delete a record and return it
Delete multiple records
const response = await supabase
  .from('countries')
  .delete()
  .eq('id', 1)
Data source
Response