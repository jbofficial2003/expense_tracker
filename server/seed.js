const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');
const Trip = require('./models/Trip');
const Expense = require('./models/Expense');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data to avoid duplicates on multiple runs
    await User.deleteMany({});
    await Trip.deleteMany({});
    await Expense.deleteMany({});

    // Create Dummy Users
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const users = await User.insertMany([
      { name: 'John Doe', email: 'john@example.com', password },
      { name: 'Jane Smith', email: 'jane@example.com', password },
      { name: 'Mike Johnson', email: 'mike@example.com', password }
    ]);
    console.log('Users inserted');

    // Create Dummy Trips
    const tripsData = [
      {
        name: 'Europe Summer Tour',
        destination: 'Paris, France',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-15'),
        currency: 'EUR',
      },
      {
        name: 'Weekend Getaway',
        destination: 'New York, USA',
        startDate: new Date('2024-08-10'),
        endDate: new Date('2024-08-12'),
        currency: 'USD',
      },
      {
        name: 'Ski Trip',
        destination: 'Aspen, Colorado',
        startDate: new Date('2024-12-20'),
        endDate: new Date('2024-12-27'),
        currency: 'USD',
      }
    ];

    const tripsToInsert = tripsData.map(t => ({
      ...t,
      createdBy: users[0]._id,
      members: [
        { userId: users[0]._id, name: users[0].name, email: users[0].email },
        { userId: users[1]._id, name: users[1].name, email: users[1].email },
        { userId: users[2]._id, name: users[2].name, email: users[2].email }
      ]
    }));

    const trips = await Trip.insertMany(tripsToInsert);
    console.log('Trips inserted');

    // Create Dummy Expenses
    const categories = ['Food', 'Hotel', 'Fuel', 'Shopping', 'Tickets', 'Other'];
    const locations = ['Paris', 'London', 'Rome', 'Berlin', 'Madrid', 'Amsterdam', 'New York', 'Aspen'];
    const expenses = [];

    for (const trip of trips) {
      for (let i = 1; i <= 20; i++) {
        const amount = Math.floor(Math.random() * 500) + 50;
        const category = categories[Math.floor(Math.random() * categories.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const date = new Date(trip.startDate.getTime() + Math.random() * (trip.endDate.getTime() - trip.startDate.getTime()));

        // Randomly decide if 1 user pays or 2 users pay
        const numPayers = Math.random() > 0.5 ? 1 : 2;
        let paidBy = [];

        if (numPayers === 1) {
          const paidByIdx = Math.floor(Math.random() * 3);
          paidBy.push({ memberId: users[paidByIdx]._id, amountPaid: amount });
        } else {
          const payer1Idx = Math.floor(Math.random() * 3);
          const payer2Idx = (payer1Idx + 1) % 3;
          const amount1 = Math.floor(amount / 2);
          const amount2 = amount - amount1;
          paidBy.push({ memberId: users[payer1Idx]._id, amountPaid: amount1 });
          paidBy.push({ memberId: users[payer2Idx]._id, amountPaid: amount2 });
        }

        const share = Number((amount / 3).toFixed(2));
        const difference = Number((amount - (share * 2)).toFixed(2));

        expenses.push({
          tripId: trip._id,
          title: `Expense ${i} - ${category}`,
          amount: amount,
          category: category,
          location: location,
          date: date,
          notes: `data ${i} for ${trip.name}`,
          tags: [category.toLowerCase()],
          paidBy: paidBy,
          splitBetween: [
            { memberId: users[0]._id, shareAmount: share },
            { memberId: users[1]._id, shareAmount: share },
            { memberId: users[2]._id, shareAmount: difference }
          ],
          createdBy: users[0]._id
        });
      }
    }

    await Expense.insertMany(expenses);
    console.log('Expenses inserted');

    console.log('data seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
