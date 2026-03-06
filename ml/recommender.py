"""
AI Recommendation Engine
Combines content-based filtering (tags, category, brand) with
collaborative filtering signals (user behavior tracking).
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer, MinMaxScaler
from data.products import products

# ── Build feature matrix ───────────────────────────────────────────────────────
df = pd.DataFrame(products)

mlb = MultiLabelBinarizer()
tag_features = mlb.fit_transform(df['tags'])
tag_df = pd.DataFrame(tag_features, columns=mlb.classes_)

category_dummies = pd.get_dummies(df['category'], prefix='cat')
brand_dummies    = pd.get_dummies(df['brand'],    prefix='brand')

scaler = MinMaxScaler()
price_norm  = scaler.fit_transform(df[['price']])
rating_norm = scaler.fit_transform(df[['rating']])

price_df  = pd.DataFrame(price_norm,  columns=['price_norm'])
rating_df = pd.DataFrame(rating_norm, columns=['rating_norm'])

# Weighted feature matrix
features = pd.concat([
    tag_df * 2.0,          # tags most important
    category_dummies * 1.5,
    brand_dummies * 1.0,
    price_df  * 0.5,
    rating_df * 0.8,
], axis=1)

similarity_matrix = cosine_similarity(features)

# In-memory behavior store  {user_id: {product_id: score}}
user_behavior: dict[str, dict[int, float]] = {}

SCORE_VIEW   = 1.0
SCORE_LIKE   = 3.0
SCORE_CART   = 5.0
SCORE_BUY    = 10.0


# ── Helpers ────────────────────────────────────────────────────────────────────

def _record(user_id: str, product_id: int, score: float):
    user_behavior.setdefault(user_id, {})
    user_behavior[user_id][product_id] = (
        user_behavior[user_id].get(product_id, 0) + score
    )


def _content_scores(product_id: int) -> np.ndarray:
    """Return cosine-similarity scores for all products vs product_id."""
    try:
        idx = df[df['id'] == product_id].index[0]
        return similarity_matrix[idx]
    except IndexError:
        return np.zeros(len(df))


# ── Public API ─────────────────────────────────────────────────────────────────

def track_event(user_id: str, product_id: int, event: str):
    """Record a user interaction (view / like / cart / buy)."""
    score_map = {'view': SCORE_VIEW, 'like': SCORE_LIKE,
                 'cart': SCORE_CART, 'buy': SCORE_BUY}
    _record(user_id, product_id, score_map.get(event, 0))


def get_recommendations(product_id: int, num: int = 6,
                         user_id: str | None = None) -> list[dict]:
    """
    Content-based recommendations, boosted by user's past behavior
    when user_id is provided.
    """
    try:
        scores = _content_scores(product_id).copy()

        # Collaborative boost: upweight products similar to what user liked
        if user_id and user_id in user_behavior:
            for pid, weight in user_behavior[user_id].items():
                boost = _content_scores(pid) * (weight / 20.0)
                scores = scores + boost

        idx = df[df['id'] == product_id].index[0]
        indexed = list(enumerate(scores))
        indexed.sort(key=lambda x: x[1], reverse=True)
        filtered = [s for s in indexed if s[0] != idx]
        top = [s[0] for s in filtered[:num]]

        recs = df.iloc[top].to_dict('records')
        # Attach match percentage
        max_score = max(s[1] for s in filtered) if filtered else 1
        for rec, (_, score) in zip(recs, filtered[:num]):
            rec['match'] = round(min(99, (score / max(max_score, 0.001)) * 99))
        return recs
    except Exception as e:
        return []


def get_personalized_feed(user_id: str, num: int = 12) -> list[dict]:
    """
    Fully personalized homepage feed based on user's behavior history.
    Falls back to trending (highest rating × reviews) for new users.
    """
    behavior = user_behavior.get(user_id, {})

    if not behavior:
        # Trending: rating × log(reviews)
        df2 = df.copy()
        df2['trend_score'] = df2['rating'] * np.log1p(df2['reviews'])
        trending = df2.nlargest(num, 'trend_score').to_dict('records')
        for p in trending:
            p['match'] = None
        return trending

    # Aggregate similarity scores across all interacted products
    agg = np.zeros(len(df))
    for pid, weight in behavior.items():
        agg += _content_scores(pid) * weight

    # Zero out already-interacted products
    for pid in behavior:
        idx_list = df[df['id'] == pid].index.tolist()
        if idx_list:
            agg[idx_list[0]] = 0

    indexed = list(enumerate(agg))
    indexed.sort(key=lambda x: x[1], reverse=True)
    top = [s[0] for s in indexed[:num]]

    recs = df.iloc[top].to_dict('records')
    max_score = max(s[1] for s in indexed) if indexed else 1
    for rec, (_, score) in zip(recs, indexed[:num]):
        rec['match'] = round(min(99, (score / max(max_score, 0.001)) * 99))
    return recs


def get_trending(num: int = 8) -> list[dict]:
    df2 = df.copy()
    df2['trend_score'] = df2['rating'] * np.log1p(df2['reviews'])
    return df2.nlargest(num, 'trend_score').to_dict('records')


def get_category_picks(category: str, num: int = 6) -> list[dict]:
    cat_df = df[df['category'] == category].copy()
    cat_df['score'] = cat_df['rating'] * np.log1p(cat_df['reviews'])
    return cat_df.nlargest(num, 'score').to_dict('records')


def search_products(query: str, filters: dict | None = None) -> list[dict]:
    q = query.lower().strip()
    results = []
    for p in products:
        searchable = (
            p['name'].lower() + ' ' +
            p['category'].lower() + ' ' +
            p['brand'].lower() + ' ' +
            ' '.join(p['tags'])
        )
        if q in searchable:
            results.append(p)

    if filters:
        if filters.get('category') and filters['category'] != 'All':
            results = [p for p in results if p['category'] == filters['category']]
        if filters.get('min_price') is not None:
            results = [p for p in results if p['price'] >= filters['min_price']]
        if filters.get('max_price') is not None:
            results = [p for p in results if p['price'] <= filters['max_price']]
        if filters.get('brand'):
            results = [p for p in results if p['brand'] == filters['brand']]
        sort = filters.get('sort', '')
        if sort == 'price_asc':
            results.sort(key=lambda x: x['price'])
        elif sort == 'price_desc':
            results.sort(key=lambda x: x['price'], reverse=True)
        elif sort == 'rating':
            results.sort(key=lambda x: x['rating'], reverse=True)
        elif sort == 'popular':
            results.sort(key=lambda x: x['reviews'], reverse=True)

    return results