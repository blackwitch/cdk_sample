import random
from fastapi import FastAPI


 # python -m uvicorn --reload main:app --port=3000
app = FastAPI()

@app.get("/")
def health_check():
    return 200

@app.get("/calc")
async def funcCalc():
    x = random.randrange(12012012, 112012012)
    formula = str(x) +' = '
    d = 2
    
    while d <= x:
        if x % d == 0:
            formula += '' + str(d) + 'x'
            x = x / d
        else:
            d = d + 1
    if formula.strip()[-1] == 'x':
    	return formula[:-1]
    else: 
        return formula