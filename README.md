# 3D Color Picker

An interactive 3D color picker built with Next.js and Three.js. This application allows users to select colors and see them applied to a 3D model in real-time.

## Features

- Real-time color application to 3D models
- Pre-defined color palette
- Custom color selection
- Recent colors history
- Model rotation controls
- Screenshot functionality
- Responsive design

## Prerequisites

- Node.js 14.x or higher
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/newleafdev/GGEZ-3D-ColorPicker.git
cd GGEZ-3D-ColorPicker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Add 3D models:
   Place your 3D model files in the `public` directory:
   - `public/bottom.glb` - The base model (will have a gray color)
   - `public/top.glb` - The top model (will change color based on user selection)

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is set up for deployment on Vercel:

1. Push your repository to GitHub.
2. Import the project to Vercel.
3. Deploy!

## Technologies Used

- Next.js - React framework
- Three.js - 3D graphics library
- TypeScript - Type safety
- Tailwind CSS - Styling
- Lucide React - Icons

## License

MIT

## Author

newleafdev 