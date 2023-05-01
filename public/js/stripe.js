/* eslint-disable */
import axios from 'axios';
const stripe = Stripe(
  'pk_test_51N1rIXIoTnkRliPmXZQp6RnChX0Jai163pKoKOljC7ajXJronPrkUqrykCaWPSqrKWhGfrBb1mtqsEp9LFKSrI8U00XhButo0O'
);
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    //1) get session from server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    location.assign(session.data.session.url);
    //2) Create chechout form + charge credit card
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
