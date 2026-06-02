// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

// import 'moment-timezone';
import moment from 'moment';

export class DateTimeService {

  constructor(
  ) { }

  static setMomentDate(datetime: Date): any {
    
    if (datetime !== null) {
      return moment(datetime?.toString() + 'Z').toDate();
    }
    else {
      return null;
    }
  }

}
