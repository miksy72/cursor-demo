console.log('hello cursor');

function extractEmails(members){
    return members.map(member => member.email);
}

function invalidateEmails(emails){
    if(!Array.isArray(emails)) { throw new Error('Emails must be an array'); }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.filter(email => !emailPattern.test(email));
}
