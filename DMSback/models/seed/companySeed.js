const Company = require('../Company'); 
const { createCompanyFolders } = require('../../utils/storage');
const {createDocumentDuplicateModel} = require('../documentDynamic')

const seedData = [
    new Company({ name: "Naziv firme1", folderName: "firNaziv1" }),
    new Company({ name: "Naziv firme2" }),
    new Company({ name: "Naziv firme3", folderName: "firNaziv1*:1" }),
];

const isValidFolderName = (name) => {
    const invalidChars = /[<>:"\/\\|?*]/;
    return !invalidChars.test(name);
};

const seedCompanies = async () => {
    try {
        const elements = await Company.countDocuments();
        if (!elements) {
            for (const newCompany of seedData) {
                const savedCompany = await newCompany.save();
                const companyCollectionName = `firma_${savedCompany?._id}`;
                
                let folderName;
                if (savedCompany.folderName && isValidFolderName(savedCompany.folderName)) {
                    folderName = savedCompany.folderName;
                } else {
                    folderName = companyCollectionName;
                }

                createCompanyFolders(folderName);            
                createDocumentDuplicateModel(companyCollectionName)

                if (folderName === companyCollectionName) {
                    savedCompany.folderName = companyCollectionName;
                    await savedCompany.save();
                }
            }
        }
    } catch (err) {
        console.error(`Error seeding companies: ${err.message}`);
    }
};

module.exports = {
    seedCompanies,
};
  
