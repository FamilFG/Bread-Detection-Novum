import sqlite3 as sq
import datetime as dt

def Base_Write(count):
    connection = sq.connect("c:/Users/User/Desktop/Novum/novum-app-main/src/bread.db")
    cursor = connection.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bread_sales(
                    Id INTEGER PRIMARY KEY,
                    Day INTEGER,
                    Month INTEGER,
                    Year INTEGER,
                    Amount INTEGER)
        ''')
    cursor.execute("SELECT MAX(Id) FROM bread_sales")
    result = cursor.fetchone()[0]
    if result is None:
        result = 0
    Id = result + 1
    Amount = count

    Today = dt.date.today()
    Day = Today.day
    Month = Today.month
    Year = Today.year
    cursor.execute("INSERT INTO bread_sales (Id,Amount,Day,Month,Year) VALUES (?,?,?,?,?)",(Id,Amount,Day,Month,Year))
    connection.commit()
    connection.close()
    
