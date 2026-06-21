import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant';
import User from './models/User';
import Table from './models/Table';
import Dish from './models/Dish';
import { generateQRCodeDataURL } from './utils/qr';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cafeflow';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seeder] Connected.');

    // Clean existing data
    console.log('[Seeder] Cleaning existing collections...');
    await Restaurant.deleteMany({});
    await User.deleteMany({});
    await Table.deleteMany({});
    await Dish.deleteMany({});
    console.log('[Seeder] Database cleaned.');

    // 1. Create Restaurant Tenant
    console.log('[Seeder] Creating sample restaurant tenant...');
    const cafe = new Restaurant({
      name: 'Central Cafe & Bistro',
      slug: 'central-cafe',
      logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=300&auto=format&fit=crop',
      address: '102 Gourmet Boulevard, Food District, Suite 5',
      contact: '+91 98765 43210',
      gstNumber: '29AAAAA1111A1Z1',
      taxRate: 5, // 5% GST
      theme: {
        primaryColor: '#d97706', // Warm Amber
        darkMode: false,
      },
      status: 'active',
    });
    await cafe.save();
    console.log('[Seeder] Restaurant "Central Cafe" created.');

    // 2. Create Users
    console.log('[Seeder] Generating users...');
    const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedStaffPassword = await bcrypt.hash('staff123', 10);

    const superAdmin = new User({
      name: 'CafeFlow Admin',
      email: 'superadmin@cafeflow.com',
      password: hashedSuperAdminPassword,
      role: 'super_admin',
    });

    const restaurantAdmin = new User({
      name: 'Sarah Jenkins',
      email: 'admin@centralcafe.com',
      password: hashedAdminPassword,
      role: 'restaurant_admin',
      restaurantId: cafe._id,
    });

    const restaurantStaff = new User({
      name: 'David Miller',
      email: 'staff@centralcafe.com',
      password: hashedStaffPassword,
      role: 'staff',
      restaurantId: cafe._id,
    });

    await superAdmin.save();
    await restaurantAdmin.save();
    await restaurantStaff.save();
    console.log('[Seeder] Users seeded: Super Admin, Restaurant Admin, Staff.');

    // 3. Create Tables and QR Codes
    console.log('[Seeder] Generating tables & QR Codes...');
    const tablesToCreate = ['1', '2', '3', '4', '5'];
    for (const tableNum of tablesToCreate) {
      const menuUrl = `${FRONTEND_URL}/r/${cafe.slug}/menu/table/${tableNum}`;
      const qrCodeData = await generateQRCodeDataURL(menuUrl);

      const table = new Table({
        restaurantId: cafe._id,
        tableNumber: tableNum,
        qrCodeUrl: qrCodeData,
      });
      await table.save();
    }
    console.log(`[Seeder] Seeded ${tablesToCreate.length} active tables.`);

    // 4. Create Dish Menu Items
    console.log('[Seeder] Seeding menu items...');
    const sampleDishes = [
      {
        name: 'Himalayan French Roast',
        description: 'Rich dark espresso roast brewed from organically farmed single-origin Nepalese beans.',
        price: 180,
        category: 'Coffee',
        veg: true,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Sugar Level',
            type: 'single',
            options: [
              { name: 'Normal Sugar', extraPrice: 0 },
              { name: 'Less Sugar', extraPrice: 0 },
              { name: 'No Sugar', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Spiced Pumpkin Latte',
        description: 'Creamy espresso blended with autumn pumpkin spices and steamed rich milk, topped with whip.',
        price: 220,
        category: 'Coffee',
        veg: true,
        image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Milk Type',
            type: 'single',
            options: [
              { name: 'Whole Milk', extraPrice: 0 },
              { name: 'Oat Milk', extraPrice: 40 },
              { name: 'Almond Milk', extraPrice: 50 },
            ],
          },
        ],
      },
      {
        name: 'Darjeeling First Flush',
        description: 'Delicate floral black tea hand-plucked in spring from high-altitude Darjeeling estates.',
        price: 150,
        category: 'Tea',
        veg: true,
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Sweetener',
            type: 'single',
            options: [
              { name: 'White Sugar', extraPrice: 0 },
              { name: 'Organic Honey', extraPrice: 20 },
              { name: 'No Sugar', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Classic Virgin Mojito',
        description: 'Refreshing muddle of fresh garden mint, lime wedges, pure sugarcane juice, and sparkling soda.',
        price: 160,
        category: 'Mocktails',
        veg: true,
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400&auto=format&fit=crop',
        customizations: [],
      },
      {
        name: 'Avocado Sourdough Toast',
        description: 'Artisanal sourdough toast topped with fresh crushed avocado, cherry tomatoes, and microgreens.',
        price: 280,
        category: 'Breakfast',
        veg: true,
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Add-Ons',
            type: 'multiple',
            options: [
              { name: 'Extra Cheese', extraPrice: 30 },
              { name: 'Poached Egg', extraPrice: 40 },
              { name: 'Extra Avocado', extraPrice: 60 },
            ],
          },
        ],
      },
      {
        name: 'Crispy Peri-Peri Fries',
        description: 'Golden double-fried Idaho potatoes tossed in a spicy, tangy African bird eye pepper seasoning.',
        price: 140,
        category: 'Snacks',
        veg: true,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Sauce Dip',
            type: 'multiple',
            options: [
              { name: 'Cheesy Dip', extraPrice: 25 },
              { name: 'Chipotle Mayo', extraPrice: 20 },
            ],
          },
        ],
      },
      {
        name: 'Penne Arrabiata Pasta',
        description: 'Penne tossed in a fiery Italian plum tomato sauce with fresh basil, garlic, and extra virgin olive oil.',
        price: 320,
        category: 'Lunch',
        veg: true,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Spice Level',
            type: 'single',
            options: [
              { name: 'Mild', extraPrice: 0 },
              { name: 'Medium', extraPrice: 0 },
              { name: 'Spicy', extraPrice: 0 },
              { name: 'Extra Spicy', extraPrice: 0 },
            ],
          },
          {
            name: 'Add-Ons',
            type: 'multiple',
            options: [
              { name: 'Grated Mozzarella', extraPrice: 40 },
              { name: 'Mushrooms & Olives', extraPrice: 50 },
            ],
          },
        ],
      },
      {
        name: 'Pan-Seared Salmon Fillet',
        description: 'Premium Atlantic salmon fillet seared to perfection, served with asparagus and roasted baby potatoes.',
        price: 540,
        category: 'Dinner',
        veg: false,
        image: 'https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Butter Prep',
            type: 'single',
            options: [
              { name: 'Herb Garlic Butter', extraPrice: 0 },
              { name: 'Lemon Dill Butter', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Molten Choco Lava Cake',
        description: 'Decadent warm dark chocolate cake filled with a gooey liquid core, served with vanilla bean gelato.',
        price: 190,
        category: 'Desserts',
        veg: true,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400&auto=format&fit=crop',
        customizations: [
          {
            name: 'Extras',
            type: 'multiple',
            options: [
              { name: 'Extra Chocolate Fudge', extraPrice: 30 },
              { name: 'Add Gelato Scoop', extraPrice: 50 },
            ],
          },
        ],
      },
    ];

    for (const item of sampleDishes) {
      const dish = new Dish({
        restaurantId: cafe._id,
        ...item,
        available: true,
      });
      await dish.save();
    }

    console.log(`[Seeder] Seeded ${sampleDishes.length} menu items.`);
    console.log('[Seeder] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
