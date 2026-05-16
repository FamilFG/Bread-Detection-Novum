import sqlite3 as sq
import datetime as dt

def Base_Write(count):
    try:
        path = "./APP/src/bread.db"
        Today = dt.date.today()

        with sq.connect(path) as Connection:
            Cursor = Connection.cursor()

            Cursor.execute('''
                CREATE TABLE IF NOT EXISTS bread_sales(
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        Day INTEGER,
                        Month INTEGER,
                        Year INTEGER,
                        Amount INTEGER)
            ''')

            # Resetting of dataset
            Cursor.execute("DELETE FROM bread_sales WHERE Year < ?",(Today.year,))

            # Creating new info(if exists just unite)
            Cursor.execute("SELECT Id,Day, Month, Year,Amount FROM bread_sales WHERE Day = ? AND Month = ? AND Year = ?",(Today.day,Today.month,Today.year))
            
            Row = Cursor.fetchone()
            
            if(Row is None):
                Cursor.execute("INSERT INTO bread_sales(Day,Month,Year,Amount) VALUES(?,?,?,?)",(Today.day,Today.month,Today.year,count))
            else:
                PreviousID = Row[0]
                ourAmount = Row[4]
                Cursor.execute("UPDATE bread_sales SET Amount = ? WHERE Id = ?",(count + ourAmount, PreviousID))
               
            Connection.commit()
    except sq.Error as e:
        print(f"Erros is {e}")

    
