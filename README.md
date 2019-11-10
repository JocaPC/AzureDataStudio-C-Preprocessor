# C-Preprocessor
This extention enables your to create C-style preprocessor directives that will modify your T-SQL script at runtime.

## Usage
1. Write a T-SQL query that has some C-stype masro definitions, for example:

```
#define DB
#ifdef DB
select * from sys.databases;
#else
select @@version;
#endif
```

2. Use **Ctrl/Cmd+Shift+R P** to run the pre-processed query. This command will pre-process your query and execute it on the current active connection.