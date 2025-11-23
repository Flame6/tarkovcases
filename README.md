# Tarkov Stash Optimizer

A web application for optimizing your Escape from Tarkov stash layout by automatically arranging cases for maximum space efficiency.

## Features

- **Automatic Optimization**: Enter your case counts and let the algorithm find the best layout
- **Manual Placement**: Drag and drop cases to manually arrange your stash
- **Multiple Stash Sizes**: Supports all stash editions (Standard, Left Behind, Prepare for Escape, Edge of Darkness)
- **Visual Preview**: See your optimized layout before applying it in-game
- **Case Management**: Track owned, placed, and remaining cases

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js HTTP server
- **Styling**: Tailwind CSS

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tarkov-stash-optimizer.git
   cd tarkov-stash-optimizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the frontend:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   node server.cjs
   ```

The application will be available at `http://localhost:5174` (or the port specified by the `PORT` environment variable).

## Development

Run the development server:
```bash
npm run dev
```

## Production Deployment

### Using PM2

1. Update `ecosystem.config.cjs` with your deployment path
2. Start with PM2:
   ```bash
   pm2 start ecosystem.config.cjs
   ```

### Using a Process Manager

The `server.cjs` file serves both the static frontend files and handles the API endpoints. Configure your reverse proxy (e.g., Caddy, Nginx) to point to the server port.

## Configuration

- **Port**: Set via `PORT` environment variable (default: 5174)
- **Counter File**: Stored in `tarkov-count.json` (created automatically)

## Project Structure

```
├── components/          # React components
├── services/           # Business logic (optimizer, counter)
├── Case Images/        # Case image assets
├── dist/               # Built frontend files
├── server.cjs          # Production server
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies
```

## License

MIT License - see [LICENSE](LICENSE) file for details

## Disclaimer

This is a fan-made tool and is not affiliated with Battlestate Games.
