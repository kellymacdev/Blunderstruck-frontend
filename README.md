# ♟️ Blunderstruck

**Blunderstruck** is a web app that visualizes a Chess.com player’s monthly performance.  
Enter any username to see rating trends, opening stats, and game results — all rendered dynamically with interactive charts.

🔗 **Live App:** [kellymacdev.github.io/blunderstruck](https://kellymacdev.github.io/blunderstruck)  
🖥️ **Backend API:** [blunderstruck.onrender.com](https://blunderstruck.onrender.com)

---

## Features

- Fetches and analyzes real Chess.com player data
- Displays rating evolution and opening frequency
- Interactive charts built with Chart.js
- Smooth Django + vanilla JS integration
- Deployed frontend on **GitHub Pages**
- Backend API hosted on **Render**

---

## How It Works

1. The **frontend** (HTML + JS) is served from GitHub Pages.  
2. When a user enters a Chess.com username, the app sends a request to the Django backend on Render.  
3. The **Django API** fetches monthly game data from the official [Chess.com API](https://www.chess.com/news/view/published-data-api), processes it, and returns it to the frontend.  
4. The frontend displays statistics and visualizations including:
   - Total games played
   - Win/loss/draw breakdown
   - Win rate
   - Monthly Elo change 
   - Opening popularity and daily elo statistics

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | HTML, CSS, JavaScript (ES6), Chart.js |
| **Backend** | Django (Python) |
| **Deployment** | GitHub Pages (frontend), Render (backend) |
| **Data Source** | [Chess.com Public API](https://www.chess.com/news/view/published-data-api) |

---

## Local Setup (for development)

### 1. Clone repo

```bash
git clone https://github.com/kellymacdev/blunderstruck.git
cd blunderstruck
```

### 2. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate      # On Windows: venv/Scripts/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Django backend locally 

```bash
python manage.py runserver
```

### 5. Adjust CORS settings
If testing locally, add localhost to settings.py
```python
CORS_ALLOWED_ORIGINS = ["http://localhost:8000",
    "http://127.0.0.1:5500",  # for local frontend testing
]
```
## Deployment 

### Frontend (GitHub Pages)
1. Commit HTML, CSS and JS files to main branch.
2. Enable GitHub Pages.
3. Site is now live at:
   ```php-template
   https://<your-username>.github.io/<repo-name>
   ```

### Backend (Render)
1. Push Django project to separate GitHub repo.
2. Create new Web Service on [Render][https://render.com/]
3. Set environment variables:
   ```env
   DJANGO_SECRET_KEY = <your_secret_key>
   DEBUG = False
   ```
4. Set Build Command and Start Command:
   ```bash
   Build Command: ./build.sh
   Start Command: gunicorn BlunderStruck.wsgi:application
   ```

## Example API Call
### Endpoint: 
```sql
GET /api/month/?username=kris_lemon&month=10&year=2025
```
### Response: 
```json
{
  "games": [
    {
      "url": "https://www.chess.com/game/live/123456789",
      "white": "Kris_Lemon",
      "black": "Opponent123",
      "rated": true,
      "time_class": "rapid",
      "end_time": 1730688000,
      ...
    }
  ]
}
```

## Developer Notes
- The backend acts purely as a proxy to the Chess.com API to avoid CORS restrictions.

## Future Improvements
- Add player comparison mode
- Show per-opening win rates
- Add caching layer for faster responses
- Include bullet/blitz filters



