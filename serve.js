const path = require('path');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_1234567890');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'GATE.html'));
});

app.post('/process-payment', async (req, res) => {
  const { cardNumber, cardName, cardExpiry, cardCVV } = req.body;

  try {
    const [expMonthRaw, expYearRaw] = String(cardExpiry || '').split('/');
    const expMonth = Number(expMonthRaw);
    const expYearShort = Number(expYearRaw);
    const expYear = expYearShort < 100 ? 2000 + expYearShort : expYearShort;

    const charge = await stripe.charges.create({
      amount: 1000, // 10 reais
      currency: 'BRL',
      source: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc: cardCVV
      },
      description: 'Pagamento via Railway'
    });

    res.json({
      success: true,
      message: 'Pagamento realizado com sucesso!',
      amount: charge.amount / 100
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
