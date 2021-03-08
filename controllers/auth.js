const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt= require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

//saving the profile information in the database and calculating the calories needed using the Harris Benedift Formula

exports.profile= async(req, res) => {
    console.log(req.body);
    const { firstname, lastname, phonenumber,height,weight,city } = req.body;
    db.query('INSERT INTO profile SET ?', {firstname: firstname, lastname: lastname, phonenumber:phonenumber , height:height, weight:weight, city:city}, (error, results) =>{
        if(error){
            console.log(error);
        }else{
            console.log(results);
            var x = 66 + (13.7* weight) + (5*height) - (6.8*23);
            console.log('To maintain your current weight you need', x, 'calories');
            return res.render('profile',{
                message: 'Information Saved Successfully'
                
            });
        }
    });
}

//login process: retrieving information securely from database and authenticating user for access.
exports.login= async(req, res) => {
   try {
    const{email, password} = req.body;

    if( !email || !password){
        return res.status(400).render('login',{
            message: 'Please Enter a valid email/password'
        });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        console.log(results)
        if(!results || !(await bcrypt.compare(password, results[0].password))){
            res.status(401).render('login', {
                message: 'Incorrect Password/Email'
            });
        }else{
            const id = results[0].id;
            const token = jwt.sign({id: id}, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });
            console.log(" The token is: " + token);
            const cookieOptions = {
                expires: new Date(
                    Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                ),
                httpOnly: true
            }
            res.cookie('jwt', token, cookieOptions);
            res.status(200).redirect("/profile");
        }
    })
   } catch (error) {
       console.log(error);
   }
}
exports.register = (req,res)=>{
   
   
    console.log(req.body);
    const { email, password, passwordConfirm} = req.body;
    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if (error){
            console.log(error);
        }
        if(results.length > 0 ){
            return res.render('signup', {
                message: 'That email is already registered'
            });
        } else if (password !== passwordConfirm){
            return res.render('signup', {
                message: 'The Passwords do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO users SET ?', {email: email, password: hashedPassword}, (error, results) =>{
            if(error){
                console.log(error);
            }else{
                console.log(results);
                return res.render('signup',{
                    message: 'User Registered Successefully, Please login to your account'
                });
            }
        });

    });
}
