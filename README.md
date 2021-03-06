# C-Preprocessor
This extention enables your to create C-style preprocessor directives that will modify your T-SQL script at runtime.

You can download [VSIX and install it in your Azure Data Studio](c-preprocesor-0.1.1.vsix).

## Usage
1. Write a T-SQL query that has some C-style macro definitions, for example:

```
#define PI 3.14

select 3*PI/4
```
Once you run the query using `Ctrl`+`Alt`+`F5`, the extension will replace defined constant `PI` with the value `3.14` and you will reun the following query:

```
select 3*3.14/4
```

You can also use conditional execution as it is shown in the following example:
```
#define DB
#ifdef DB
select * from sys.databases;
#else
select @@version;
#endif
```

This extension will evaluate #ifdef/#else conditions and execute first or second script.

2. Use **Ctrl+Alt+F5** to run the pre-processed query. This command will pre-process your query and execute it on the current active connection.
2.1. As an alternative use **Ctrl+Alt+F6** to run the pre-processed query in a new window. This option is usefull if you processed query fails and then you need to see generated source. 

## Examples

### Example 1 - Custom aggregate functions

Let's assume that you have defined the following directives:
```
#define COUNTIF(condition) SUM(CASE WHEN condition THEN 1 ELSE 0 END)
#define SUMIF(column,condition)  SUM(CASE WHEN condition THEN column ELSE 0 END)
#define AVGIF(column,condition)  AVG(CASE WHEN condition THEN column END)
```

Now you could run the query like:
```
select  COUNTIF(database_id < 100),
        SUMIF(database_id, database_id < 100),
        AVGIF(database_id, database_id < 100)
 from sys.databases;

```
Result will be:

```
select  SUM(CASE WHEN database_id < 100 THEN 1 ELSE 0 END),
        SUM(CASE WHEN  database_id < 100 THEN database_id ELSE 0 END),
        AVG(CASE WHEN  database_id < 100 THEN database_id END)
 from sys.databases;
```

### Example 2 - Custom window functions

Let's assume that you have defined the following directives:
```
#define PREV(column,offset)  LAG(column, offset, NULL) OVER (ORDER BY column) 
#define NEXT(column,offset)  LEAD(column, offset, NULL) OVER (ORDER BY column) 
#define PREVBY(column,offset,order)  LAG(column, offset, NULL) OVER (ORDER BY order) 
#define NEXTBY(column,offset,order)  LEAD(column, offset, NULL) OVER (ORDER BY order) 
#define PREVBYON(column,offset,order,partition)  LAG(column, offset, NULL) OVER (PARTITION BY partition ORDER BY order) 
#define NEXTBYON(column,offset,order,partition)  LEAD(column, offset, NULL) OVER (PARTITION BY partition ORDER BY order) 
```

Now you could run the query like:
```
select  prev=PREV(database_id, 1),
        database_id,
        next = NEXT(database_id, 1),
        prev_by_name = PREVBY(database_id,1,name),
        next_by_name = NEXTBY(database_id,1,name)
 from sys.databases;
```

Result will be:
```
select  prev=LAG(database_id,  1, NULL) OVER (ORDER BY database_id),
        database_id,
        next = LEAD(database_id,  1, NULL) OVER (ORDER BY database_id),
        prev_by_name = LAG(database_id, 1, NULL) OVER (ORDER BY name),
        next_by_name = LEAD(database_id, 1, NULL) OVER (ORDER BY name)
 from sys.databases;
```