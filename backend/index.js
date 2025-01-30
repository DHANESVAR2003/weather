const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;


app.use(cors());
app.use(bodyParser.json());

const mongoURI = 'mongodb://localhost:27017/weather'; 


mongoose.connect(mongoURI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));


const searchHistorySchema = new mongoose.Schema({
  city_name: { type: String, required: true },
}, { timestamps: true });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);


app.post('/api/saveSearch', async (req, res) => {
  const { city_name } = req.body;

  
  if (!city_name || city_name.trim() === '') {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
  
    const newSearch = new SearchHistory({ city_name });
    await newSearch.save();
    res.status(200).json({ message: 'Search saved successfully!' });
  } catch (err) {
    console.error('Error saving search:', err);
    res.status(500).json({ error: 'Failed to save search' });
  }
});


app.get('/api/getSearchHistory', async (req, res) => {
  try {
    const history = await SearchHistory.find().sort({ createdAt: -1 }); // Sort by createdAt (most recent first)
    res.status(200).json(history);
  } catch (err) {
    console.error('Error fetching search history:', err);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});


app.delete('/api/clearHistory', async (req, res) => {
  try {
    // Remove all records from the SearchHistory collection
    await SearchHistory.deleteMany();
    res.status(200).json({ message: 'Search history cleared successfully!' });
  } catch (err) {
    console.error('Error clearing search history:', err);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
