
import os
from flask import Flask, render_template, redirect, url_for, flash, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from models import db, User, Semester, Subject
from forms import RegisterForm, LoginForm, AddSubjectForm


app = Flask(__name__)
app.jinja_env.globals.update(os=os)


app.config.from_object(Config)

db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'




@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        hashed_pw = generate_password_hash(form.password.data)
        user = User(username=form.username.data, password=hashed_pw)
        db.session.add(user)
        db.session.commit()
        flash('Account created!', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password, form.password.data):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Login failed. Try again.', 'danger')
    return render_template('login.html', form=form)

@app.route('/dashboard', methods=['GET', 'POST'])
@login_required
def dashboard():
    form = AddSubjectForm()
    if form.validate_on_submit():
        sem = Semester.query.filter_by(user_id=current_user.id, number=form.semester.data).first()
        if not sem:
            sem = Semester(number=form.semester.data, user=current_user)
            db.session.add(sem)
            db.session.commit()
        subject = Subject(name=form.subject_name.data, semester=sem)
        db.session.add(subject)
        db.session.commit()
        os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], current_user.username, f"Semester{sem.number}",
                                 form.subject_name.data), exist_ok=True)

        flash('Subject added!', 'success')
    semesters = Semester.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', semesters=semesters, form=form)


@app.route('/semester/<int:sem_id>', methods=['GET', 'POST'])
@login_required
def semester_view(sem_id):
    sem = Semester.query.get_or_404(sem_id)
    upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.username, f"Semester{sem.number}")

    if request.method == 'POST':
        subject_id = request.form['subject_id']
        file = request.files['file']
        subject = Subject.query.get_or_404(subject_id)
        if file:
            subject_folder = os.path.join(upload_folder, subject.name)
            os.makedirs(subject_folder, exist_ok=True)
            filepath = os.path.join(subject_folder, file.filename)
            file.save(filepath)
            flash(f"Uploaded {file.filename} to {subject.name}", "success")
        return redirect(url_for('semester_view', sem_id=sem.id))

    return render_template('semester.html', semester=sem)


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

from flask import send_from_directory

@app.route('/download/<path:filename>')
@login_required
def download_file(filename):
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], current_user.username)
    return send_from_directory(filepath, filename, as_attachment=True)


@app.route('/delete/<int:sem_id>/<subject_name>/<filename>', methods=['POST'])
@login_required
def delete_file(sem_id, subject_name, filename):
    sem = Semester.query.get_or_404(sem_id)
    file_path = os.path.join(
        app.config['UPLOAD_FOLDER'],
        current_user.username,
        f"Semester{sem.number}",
        subject_name,
        filename
    )
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            flash(f"Deleted {filename}", "warning")
    except Exception as e:
        flash(f"Error deleting file: {str(e)}", "danger")
    return redirect(url_for('semester_view', sem_id=sem.id))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)