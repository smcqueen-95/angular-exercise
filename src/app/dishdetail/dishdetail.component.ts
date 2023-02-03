import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import {Dish} from '../shared/dish';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { visibility } from '../animations/app.animations';
import { flyInOut, expand } from '../animations/app.animations';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';
import { Rating } from '../shared/rating';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
    visibility(),
    flyInOut(),
    expand()
  ],
  // tslint:disable-next-line:use-host-property-decorator
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
    },
})
export class DishdetailComponent implements OnInit {

  formatLabel(value: number) {
    if (value >= 1) {

    return value;
  }
}

  visibility ='shown';
  dishcopy: Dish;
  errMess: string;
  dishIds: string[];
  prev: string;
  next: string;
  dish: Dish;
  currentdate: Date;
  commentForm: UntypedFormGroup;
  comment: Comment;
  rating: Rating;
  @ViewChild(FormGroupDirective) commentFormDirective: FormGroupDirective;
  

  formErrors = {
    'author': '',
    'rating': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':      'Author is required.',
      'minlength':     'Author must be at least 2 characters long.',
      'maxlength':     'Author cannot be more than 25 characters long.'
    },
    'rating': {
      'required':      'Rating is required.',
    },
    'comment': {
      'required':      'Comment is required.',
    },
  };


  constructor(
    private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: UntypedFormBuilder,
    @Inject('BaseURL') private BaseURL) 
  { 
    this.currentdate = new Date();
    this.createForm()
  }

  ngOnInit() {
    this.dishService.getDishIds()
    .subscribe((dishIds) => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(+params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess);
  }

  createForm() {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
      rating: ['', [Validators.required] ],
      comment: ['', [Validators.required] ],
      date: this.currentdate.toDateString()
    });

    this.commentForm.valueChanges.subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); //(re)set form validation messages
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.currentdate.toDateString()
    console.log(this.comment);
    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
    .subscribe(dish => {
      this.dish = dish; this.dishcopy = dish;
    },
    errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
    this.commentFormDirective.resetForm()
    this.commentForm.reset({
      author: '',
      rating: '',
      comment: ''
    });
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }


}
