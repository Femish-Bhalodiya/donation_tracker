# COC Helper

A Clash of Clans helper application that tracks clan member donations and stores them in Supabase.

## Features

- Tracks clan member donations using the COC API
- Stores donation data in Supabase
- Polls every 3 seconds to maintain accurate donation counts
- Handles member join/leave scenarios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
COC_API_KEY=your_coc_api_key
CLAN_TAG=your_clan_tag
```

3. Run the application:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase API key
- `COC_API_KEY`: Your Clash of Clans API key
- `CLAN_TAG`: Your clan's tag (with #, e.g., #ABC123) 