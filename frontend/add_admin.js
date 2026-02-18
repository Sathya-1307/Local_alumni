// const mongoose = require('mongoose');

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/alumni-webinar', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
//   process.exit(1);
// });

// // Define Coordinator schema
// const coordinatorSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   role: {
//     type: String,
//     required: true,
//     enum: ['student', 'department']
//   },
//   name: {
//     type: String,
//     trim: true
//   },
//   department: {
//     type: String,
//     trim: true
//   },
//   phoneNumber: {
//     type: String,
//     trim: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// const Coordinator = mongoose.model('Coordinator', coordinatorSchema);

// async function addAdminCoordinator() {
//   try {
//     // Check if coordinator already exists
//     const existingCoordinator = await Coordinator.findOne({ email: 'anithait@nec.edu.in' });
//     if (existingCoordinator) {
//       console.log('Coordinator with email anithait@nec.edu.in already exists');
//       return;
//     }

//     // Create new coordinator
//     const coordinator = new Coordinator({
//       email: 'anithait@nec.edu.in',
//       role: 'department',
//       name: 'Anitha IT', // Assuming a name, can be updated later
//       department: 'IT' // Assuming department
//     });

//     await coordinator.save();
//     console.log('Admin coordinator added successfully:', coordinator);
//   } catch (error) {
//     console.error('Error adding coordinator:', error);
//   } finally {
//     mongoose.connection.close();
//   }
// }

// addAdminCoordinator();
