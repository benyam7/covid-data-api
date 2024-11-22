import mongoose, { Schema, model, Document } from 'mongoose';

export interface ICovidData {
    iso_code: string;
    continent: string;
    location: string;
    date: Date;
    total_cases?: number;
    new_cases?: number;
    total_deaths?: number;
    new_deaths?: number;
    total_cases_per_million?: number;
    new_cases_per_million?: number;
    total_deaths_per_million?: number;
    new_deaths_per_million?: number;
    stringency_index?: number;
    population_density?: number;
    median_age?: number;
    aged_65_older?: number;
    aged_70_older?: number;
    gdp_per_capita?: number;
    extreme_poverty?: number;
    cardiovasc_death_rate?: number;
    diabetes_prevalence?: number;
    female_smokers?: number;
    male_smokers?: number;
    hospital_beds_per_thousand?: number;
    life_expectancy?: number;
    human_development_index?: number;
    population?: number;
    excess_mortality_cumulative_absolute?: number;
    excess_mortality_cumulative?: number;
    excess_mortality?: number;
    excess_mortality_cumulative_per_million?: number;
}
const covidSchema = new Schema<ICovidData>(
    {
        iso_code: { type: String },
        continent: { type: String },
        location: { type: String, index: true },
        date: { type: Date, index: true },
        total_cases: { type: Number, index: true },
        new_cases: { type: Number },
        total_deaths: { type: Number, index: true },
        new_deaths: { type: Number },
        total_cases_per_million: { type: Number },
        new_cases_per_million: { type: Number },
        total_deaths_per_million: { type: Number },
        new_deaths_per_million: { type: Number },
        stringency_index: { type: Number },
        population_density: { type: Number },
        median_age: { type: Number },
        aged_65_older: { type: Number },
        aged_70_older: { type: Number },
        gdp_per_capita: { type: Number },
        extreme_poverty: { type: Number },
        cardiovasc_death_rate: { type: Number },
        diabetes_prevalence: { type: Number },
        female_smokers: { type: Number, index: true },
        male_smokers: { type: Number, index: true },
        hospital_beds_per_thousand: { type: Number },
        life_expectancy: { type: Number },
        human_development_index: { type: Number },
        population: { type: Number },
        excess_mortality_cumulative_absolute: { type: Number },
        excess_mortality_cumulative: { type: Number },
        excess_mortality: { type: Number },
        excess_mortality_cumulative_per_million: { type: Number },
    },
    {
        collection: 'covid-csv-data',
    }
);

export const CovidData = model('CovidData', covidSchema);
