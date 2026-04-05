from pymongo import MongoClient

c = MongoClient('mongodb+srv://arunvashisth80_db_user:arun8080@smartresq.fii5rvi.mongodb.net/')
db = c['smartresq']

r = db.users.update_many({}, {'$set': {'account_status': 'approved'}})
print(f'Approved all: {r.modified_count} user(s) updated')

for u in db.users.find({}, {'username': 1, 'role': 1, 'account_status': 1, '_id': 0}):
    print(u)
